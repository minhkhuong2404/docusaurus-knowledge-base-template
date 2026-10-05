---
id: card_disputes_lcr
title: "Disputes, Chargeback Lifecycles & Least-Cost Routing (LCR)"
sidebar_label: "Disputes, Chargebacks & LCR"
sidebar_position: 6
description: Comprehensive principal engineering guide to card dispute management, 4-stage chargeback lifecycles, Visa Compelling Evidence 3.0 (CE3.0), Australian Dual-Network Debit Cards (DNDC), and Least-Cost Routing (LCR) mechanics.
tags: [banking, cards, chargebacks, disputes, compelling-evidence, ce30, lcr, least-cost-routing, eftpos, dndc, rba]
---

import BankingCardPaymentFlowDiagram from '@site/src/components/BankingCardPaymentFlowDiagram';

# 🛡️ Disputes, Chargeback Lifecycles & Least-Cost Routing (LCR)

Unlike irrevocable real-time settlement rails, card schemes provide cardholders with legally guaranteed consumer protection and dispute rights.

This guide explores the multi-stage chargeback lifecycle, friendly fraud mitigation via Visa Compelling Evidence 3.0, and the engineering of **Least-Cost Routing (LCR)** on Australian Dual-Network Debit Cards.

---

## 1. The Multi-Stage Chargeback Lifecycle

When a cardholder disputes a transaction, the card schemes govern an adversarial dispute process with strict timeframes (typically 30–45 days per stage):

```
Stage 1: First Chargeback
  - Cardholder disputes transaction via Issuer (e.g. Fraud or Goods Not Received).
  - Issuer provisionally credits cardholder and debits Acquirer.
  - Acquirer debits merchant account + assesses Chargeback Fee ($15–$25).
             │
             ├── Merchant Accepts Loss ──➔ Case Closed (Merchant forfeits funds)
             │
             ▼
Stage 2: Second Presentment (Representment)
  - Merchant submits Rebuttal Evidence Package (signed POD, IP logs, 3DS CAVV).
  - Acquirer re-debits cardholder and re-credits merchant.
             │
             ├── Issuer Accepts Proof ───➔ Case Closed (Merchant recovers funds)
             │
             ▼
Stage 3: Pre-Arbitration / Arbitration
  - Issuer disputes representment; both parties remain at an impasse.
  - Case submitted to Card Scheme Arbitration Committee (Visa/Mastercard).
  - Scheme reviews evidence and issues a final, non-appealable ruling.
  - Losing party pays transaction amount + $500 USD Scheme Arbitration Fee.
```

<BankingCardPaymentFlowDiagram initialTab="chargeback" />

---

## 2. Chargeback Reason Code Taxonomy

Disputes are categorized by standardized reason codes across the major card networks:

| Scheme Category | Visa Code Family | Mastercard Code Family | Common Causes & Engineering Mitigations |
|---|---|---|---|
| **Fraud** | `10.1` - `10.5` | `4837` / `4863` | Card-Not-Present unauthorized transactions. Mitigate via **EMV 3DS 2.2** liability shift and device fingerprinting. |
| **Authorization** | `11.1` - `11.3` | `4808` | Transaction processed without valid authorization approval code, or after auth expired. Enforce strict auth-to-clearing reconciliation. |
| **Processing Errors** | `12.1` - `12.7` | `4834` | Duplicate processing, incorrect transaction amount, or late presentment (>180 days). Enforce database idempotency keys. |
| **Customer Disputes** | `13.1` - `13.9` | `4853` | Goods not received, defective merchandise, or cancelled recurring subscription. Mitigate via proactive refunds and carrier tracking APIs. |

---

## 3. Visa Compelling Evidence 3.0 (CE3.0)

Introduced in 2023, **Compelling Evidence 3.0 (CE3.0)** was designed to combat **"Friendly Fraud"** (first-party misuse where legitimate cardholders falsely claim unfamiliarity with valid purchases):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VISA COMPELLING EVIDENCE 3.0 (CE3.0) QUALIFICATION RULES                    │
│                                                                             │
│ To pre-emptively overturn Reason Code 10.4 (Fraud - Card-Not-Present),     │
│ the merchant must prove the cardholder made 2 prior undisputed purchases:   │
│                                                                             │
│ 1. Both transactions occurred on the SAME card (FPAN/Token).               │
│ 2. Both transactions are older than 120 days and under 365 days.           │
│ 3. Must match at least TWO core telemetry attributes across all 3 orders:   │
│    ├── Core Attribute A: Matching Customer IP Address                       │
│    ├── Core Attribute B: Matching Device ID / Fingerprint Hash              │
│    ├── Core Attribute C: Matching Physical Delivery Address                 │
│    └── Core Attribute D: Matching User Account / Login ID                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pre-Arbitration Invalidation
When a merchant submits CE3.0 qualified evidence through the Visa Resolve Online (VROL) API:
- The chargeback is **automatically blocked or reversed before reaching representment**.
- The dispute is counted outside of the merchant's Visa Fraud Monitoring Program (VFMP) fraud ratio thresholds.

---

## 4. Australian Domestic Payments: Least-Cost Routing (LCR)

Australia has one of the world's highest penetrations of contactless debit payments. The majority of domestic debit cards issued by banks are **Dual-Network Debit Cards (DNDC)**:

```
┌────────────────────────────────────────────────────────┐
│               DUAL-NETWORK DEBIT CARD (DNDC)           │
│                                                        │
│  Application Identifier 1 (AID 1):                     │
│  Visa Debit (A0000000031010) / Mastercard Debit        │
│  Interchange Fee: ~0.50% - 0.85% (ad valorem)          │
│                                                        │
│  Application Identifier 2 (AID 2):                     │
│  eftpos Australia (A00000038410)                       │
│  Interchange Fee: ~0.15% - 0.25% (or fixed flat cents) │
└────────────────────────────────────────────────────────┘
```

### The Reserve Bank of Australia (RBA) Mandate
Under Payment Systems (Regulation) Act mandates by the RBA:
1. **Merchant-Choice Routing (MCR)**: Acquirers and terminal providers must provide merchants with the capability to automatically route contactless tap-and-go and online debit transactions over the cheapest network (typically domestic eftpos).
2. **Online E-Commerce LCR**: By 2024, all major Australian payment gateways and banks must support dual-network debit routing for online e-commerce transactions as well as physical POS.

### Terminal Routing Algorithm

At the point of sale, the smart terminal evaluates the transaction parameters to choose the routing path:

```
                    [Cardholder Taps Debit Card]
                                 │
                                 ▼
                     [Terminal Reads Card AIDs]
                                 │
                 ┌───────────────┴───────────────┐
                 │ Is Card a Dual-Network Card?  │
                 └───────────────┬───────────────┘
                        YES      │      NO (Single Scheme / Credit)
                                 │      └── Route via Scheme
                                 ▼
                 ┌───────────────────────────────┐
                 │ Merchant LCR Policy Active?   │
                 └───────────────┬───────────────┘
                                 │ YES
                                 ▼
          ┌──────────────────────────────────────────────┐
          │ Evaluate Transaction Amount vs. Threshold    │
          │                                              │
          │ eftpos fee = $0.05 flat                      │
          │ Visa/MC fee = 0.60% ($0.60 per $100)         │
          │                                              │
          │ For amounts > $15 AUD:                       │
          │   eftpos is significantly cheaper!           │
          └──────────────────────┬───────────────────────┘
                                 │
                                 ▼
                 [Route Transaction via eftpos AID]
```

### Economic Impact
* **Merchant Savings**: Saves Australian small businesses and retailers over **$200 million AUD annually** in card acceptance overhead.
* **Competitive Balance**: Prevents global card schemes from raising domestic debit interchange rates unilaterally by maintaining competitive pressure from Australia's sovereign domestic payment rail (eftpos).

---

## 5. Architectural Checklist for Dispute & Routing Engines

- [ ] **Dual-AID Recognition**: Does POS and e-commerce payment software identify dual-network debit cards via 8-digit BIN range tables?
- [ ] **Threshold-Based Routing**: Does the payment engine dynamically calculate the tipping point where percentage-based scheme fees exceed fixed-cent domestic network fees?
- [ ] **Automated CE3.0 Data Ingestion**: Does the dispute platform automatically query historical transaction logs for IP, device ID, and address matches upon receiving an RFI?
- [ ] **3DS Liability Shield Validation**: Does the settlement engine verify whether `CAVV`/`AAV` cryptograms were captured before accepting fraud chargebacks from acquirers?

---

## Related Documentation

- [Cards & Card Schemes Architecture Overview](./cards.md)
- [Card Anatomy & EMV Chip Cryptography](./card_anatomy_emv.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
- [Processing Models, Clearing & Interchange Economics](./card_clearing_settlement.md)
- [Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)
- [Fraud Detection & Prevention Architecture](./fraud.md)
