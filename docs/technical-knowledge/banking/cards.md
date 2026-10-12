---
id: cards
title: "Cards & Card Schemes Architecture Overview"
sidebar_label: "Cards Overview & Schemes"
sidebar_position: 1
description: Comprehensive principal engineering guide to global payment card schemes, open-loop (4-party) vs closed-loop (3-party) operating models, scheme switch topologies, and architectural trade-offs against real-time account-to-account rails.
tags: [banking, cards, card-schemes, 4-party, 3-party, visa, mastercard, amex, eftpos, architecture]
---

import BankingCardPaymentFlowDiagram from '@site/src/components/BankingCardPaymentFlowDiagram';

# 💳 Cards & Card Schemes Architecture Overview

Payment cards (debit, credit, prepaid, and commercial) process tens of trillions of dollars annually across global and domestic payment networks. 

Unlike modern account-to-account (A2A) instant payment rails (such as Australia's **NPP**, the US **FedNow**, Europe's **SEPA Instant**, or Brazil's **Pix**) where funds settle immediately between bank accounts, card schemes are designed as a decoupled two-phase architecture: **sub-second real-time authorization holds** followed by **asynchronous batch clearing and multilateral net settlement**.

<BankingCardPaymentFlowDiagram initialTab="auth" />

---

## 1. 4-Party vs. 3-Party Card Scheme Models

Card schemes operate under two distinct structural topologies:

```
4-PARTY MODEL (Open Loop - Visa, Mastercard, eftpos, UnionPay):

                  ┌─────────────────────────────────────┐
                  │          CARD SCHEME SWITCH         │
                  │       (VisaNet / Mastercard BankNet) │
                  └──────────▲───────────────┬──────────┘
                             │               │
             ISO 8583 0100   │               │ ISO 8583 0100
              Auth Request   │               │ Auth Request
                             │               ▼
                ┌────────────┴────┐     ┌────┴────────────┐
                │  ACQUIRING BANK │     │   ISSUING BANK  │
                │ (Merchant's FI) │     │ (Customer's FI) │
                └────────────▲────┘     └────┬────────────┘
                             │               │
                             │               ▼
                    ┌─────────┴────────┐ ┌────┴────────────┐
                    │     MERCHANT     │ │    CARDHOLDER   │
                    │ (Point of Sale)  │ │   (Payer / Tap) │
                    └──────────────────┘ └─────────────────┘

3-PARTY MODEL (Closed Loop - American Express, Diners Club):

                  ┌─────────────────────────────────────┐
                  │          CLOSED-LOOP SCHEME         │
                  │         (Issuer + Acquirer)         │
                  └──────────▲───────────────┬──────────┘
                             │               │
                             │               │
                    ┌────────┴─────────┐ ┌───▼─────────────┐
                    │     MERCHANT     │ │    CARDHOLDER   │
                    │  (Direct Accept) │ │  (Proprietary)  │
                    └──────────────────┘ └─────────────────┘
```

### Architectural Comparison Matrix

| Architectural Dimension | 4-Party Model (Open-Loop) | 3-Party Model (Closed-Loop) |
|---|---|---|
| **Representative Schemes** | Visa, Mastercard, eftpos (Australia), UnionPay | American Express (Amex), Diners Club, Discover |
| **Participants** | Cardholder, Issuing Bank, Scheme Switch, Acquiring Bank, Merchant | Cardholder, Scheme Entity, Merchant |
| **Interchange Fees** | **Yes**: Regulated fee transfer from Acquirer to Issuer to balance credit risk and rewards funding. | **No**: Single entity sets merchant discount rates directly without inter-bank interchange. |
| **Acceptance Reach** | Universal: Hundreds of thousands of financial institutions and tens of millions of merchants. | Selective: Historically concentrated in corporate travel, entertainment, and luxury retail. |
| **Merchant Cost** | Interchange++ or Blended MDR (~0.30% to 1.80%). | Typically higher flat merchant discount rate (~1.50% to 3.00%). |
| **Switch Routing** | Acquirers route over global switches (VisaNet / BankNet) using BIN routing tables. | Acquirers or merchants route directly into the proprietary scheme host. |

---

## 2. Scheme Operating Regulations & Legal Contracts

Card networks are not merely technology switches; they are governance bodies with rigorous operating rules (e.g. *Visa Core Rules*, *Mastercard Rules*):

1. **Honor All Cards Rule**: If a merchant accepts Visa credit, they traditionally had to accept all valid Visa credit cards regardless of the issuing bank (subject to regional regulatory unbundling).
2. **Settlement Guarantee**: The card scheme guarantees payment to the acquiring bank even if an issuing bank collapses overnight, backed by mandatory scheme collateral reserves.
3. **Chargeback & Consumer Rights**: Unlike irreversible wire or A2A transfers, card schemes contractually grant cardholders dispute rights for fraud, unauthorized charges, or non-delivery of goods.
4. **Acquirer Underwriting Responsibility**: The acquiring bank assumes 100% financial liability for merchant fraud, chargeback losses, and merchant bankruptcy.

---

## 3. Card Rails vs. Real-Time Account-to-Account (A2A) Rails

| Architectural Feature | Card Schemes (Visa / Mastercard) | Real-Time A2A Rails (NPP / FedNow / Pix) |
|---|---|---|
| **Messaging Protocol** | ISO 8583 / AS 2805 (Binary/ASCII) | ISO 20022 XML (`pacs.008`, `pain.001`) |
| **Processing Architecture** | Two-phase: Real-time Auth (`0100`) + Batch Clearing (`0220`) | Single-phase: Real-time immediate debit and credit posting |
| **Funds Finality** | Conditional (Subject to 120-day dispute/chargeback window) | Irrevocable (Immediate finality upon settlement) |
| **Acceptance Cost** | High: 0.50% - 2.50% Merchant Discount Rate (MDR) | Ultra-low: 0.00% - 0.20% or flat fraction-of-a-cent fees |
| **Customer Experience** | Contactless NFC tap, Network Tokenization, Apple Pay | PayID / Alias, QR Code, Open Banking / PayTo |
| **Offline Processing** | Supported: Offline Chip Authentication (DDA/CDA) & Floor Limits | Not supported: Requires active end-to-end network connectivity |
| **Fraud & Dispute Recourse** | Global chargeback lifecycle, liability shift, 3DS 2.2 | Confirmation of Payee (CoP), Scam investigation frameworks |

---

## 4. Cards Knowledge Base Directory

Explore the deep-dive engineering modules across every layer of the card payment stack:

```
 docs/technical-knowledge/banking/
 ├── cards.md                      ◄ (You are here: Architecture Overview & Operating Models)
 ├── card_anatomy_emv.md           ◄ ISO/IEC 7812 PAN, Luhn Mod 10, Magstripe vs Chip, EMV Cryptography
 ├── card_iso8583.md               ◄ ISO 8583 & AS 2805 wire protocols, MTI, Bitmaps, Java 21 Engine
 ├── card_clearing_settlement.md   ◄ SMS vs DMS, Authorization Holds, BASE II / IPM, MDR & Interchange
 ├── card_tokenization_3ds.md      ◄ EMVCo Network Tokens (DPAN), Apple Pay, 3DS 2.2, Liability Shift
 └── card_disputes_lcr.md          ◄ Chargebacks, Visa CE3.0, Australian DNDC & Least-Cost Routing
```

### Module Summaries:

* **[1. Card Anatomy & EMV Chip Cryptography](./card_anatomy_emv.md)**:
  * ISO/IEC 7812 PAN structure, 8-digit BIN migration, and production Java 21 Luhn Mod 10 implementation.
  * Contact (ISO/IEC 7816) and Contactless NFC (ISO/IEC 14443) APDU command-response sequences.
  * Offline card authentication (SDA vs DDA vs CDA) and Application Cryptograms (ARQC, ARPC, TC, AAC).
* **[2. ISO 8583 & AS 2805 Wire Protocols](./card_iso8583.md)**:
  * Message Type Identifier (MTI) anatomy and 64-bit/128-bit bitmap bitwise architectures.
  * Essential Data Elements catalog (`DE 2`, `DE 3`, `DE 4`, `DE 11 STAN`, `DE 22`, `DE 52 PIN`, `DE 55 EMV`).
  * Australian AS 2805 standard peculiarities and production Java 21 Spring Boot ISO 8583 authorization handler.
* **[3. SMS vs DMS, Clearing & Interchange Economics](./card_clearing_settlement.md)**:
  * Single-Message System (SMS) vs Dual-Message System (DMS) processing comparisons.
  * Authorization hold reservation, decay, and pre-authorization adjustments.
  * Clearing formats (Visa BASE II `TC 05` and Mastercard IPM `1240`) and Merchant Discount Rate (MDR) formulas.
* **[4. Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)**:
  * EMVCo Network Tokenization lifecycle: Funding PAN (FPAN) $\rightarrow$ Device PAN (DPAN), TRID, and dynamic cryptograms (TAVV/DSRP).
  * Apple Pay & Google Wallet Secure Element (eSE) and Consumer Device Cardholder Verification (CDCVM).
  * EMV 3-D Secure 2.2 / 2.3 protocol: Frictionless vs Challenge flows, 150+ risk signals, and liability shift rules.
* **[5. Disputes, Chargebacks & Least-Cost Routing](./card_disputes_lcr.md)**:
  * 4-stage chargeback lifecycle, reason code taxonomy, and arbitration risk.
  * Visa Compelling Evidence 3.0 (CE3.0) against first-party friendly fraud.
  * Australian Dual-Network Debit Cards (DNDC) and Least-Cost Routing (LCR) terminal algorithms under RBA mandates.

---

## 5. Principal Architect Certification Checklist

Before certifying any card issuing, acquiring, or switching platform for production launch, verify:

- [ ] **Dual-BIN Support**: Does the platform support 8-digit Bank Identification Numbers (BINs) alongside legacy 6-digit ranges?
- [ ] **HSM Cryptographic Boundaries**: Are PIN verification (ISO 9564) and CVV calculation strictly offloaded to PCI-HSMs without plaintext data touching JVM memory?
- [ ] **Network Tokenization Lifecycle**: Does the payment gateway support cryptogram updates (TAVV/DSRP) and automatic token refreshes when underlying physical cards are re-issued?
- [ ] **Dual-Message Reversal Safety**: Does the system automatically release authorization holds after expiry (e.g. 7 days for retail, 30 days for car rentals) if no clearing presentment arrives?
- [ ] **Least-Cost Routing Compliance**: Does terminal routing logic dynamically evaluate eftpos vs Visa/Mastercard debit interchange caps per RBA regulations?
- [ ] **PCI-DSS Scope Segregation**: Are cardholder environments isolated using Point-to-Point Encryption (P2PE) and edge tokenization vaults (SAQ A eligibility)?

---

## Related Documentation

- [Card Anatomy & EMV Chip Cryptography](./card_anatomy_emv.md)
- [Card Wire Protocols: ISO 8583 & AS 2805](./card_iso8583.md)
- [SMS vs DMS, Clearing & Interchange Economics](./card_clearing_settlement.md)
- [Network Tokenization & EMV 3-D Secure](./card_tokenization_3ds.md)
- [Disputes, Chargebacks & Least-Cost Routing](./card_disputes_lcr.md)
- [Payment Processing Resilience: Idempotency & Loss Prevention](./idempotency.md)
- [Payment Security Architecture: Ingress & Core Defense](./payment_security.md)
