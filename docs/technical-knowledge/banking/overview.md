---
id: overview
title: Banking Domain Knowledge Base
sidebar_label: Overview
sidebar_position: 0
slug: /banking
description: Overview of Banking Domain Knowledge Base.
tags: [banking, overview, domain]
---

# 🏦 Banking Domain Knowledge Base

A comprehensive, engineer-focused reference for payment systems, ISO 20022 messaging, core banking concepts, and Australian payment infrastructure. Built for Java/Spring developers working in the payments domain.

---

## What's in This Knowledge Base?

| Section | Topics Covered |
|---------|---------------|
| **ISO 20022 Messages** | pain.001, pain.002, pacs.008, pacs.002, camt.053, camt.054, camt.055/056, pain.007/pacs.007 |
| **Payment Flows** | Inbound, Outbound, On-Us, Off-Us |
| **Payment Rails** | NPP, PayTo, SWIFT, BECS, Direct Debit, BPAY, RTGS/HVCS |
| **Parties & Institutions** | Debtor, Creditor, FIs, Correspondent Banks, Nostro/Vostro |
| **Accounting & Posting** | Debit/Credit Post, Debit Reversal, Payment Return |
| **Clearing & Settlement** | DNS, RTGS, ESA, Liquidity Management, Gridlock Resolution |
| **Risk & Compliance** | Fraud, CoP, Sanctions, AML/CTF, KYC, Regulatory Reporting |
| **Operations** | Reconciliation, Exceptions & Investigations, FX, Error Codes |
| **Architecture** | Payment Hub, Idempotency, FIS Integration |
| **Modern Banking** | Open Banking/CDR, ISO 20022 Migration, Account Types |

---

## Banking Knowledge Path

Use this path as a guided entry point for learning banking and payments topics in a practical order.

### How To Use This Path
- Read each stage in order the first time.
- Use the **Role Tracks** below after Stage 2 to specialize.
- Keep `payment_lifecycle_101` and the glossary open while reading message specs.

### Stage 0 - Foundations (Beginner)
Start here if you are new to the banking/payments domain language.
1. [Overview](./overview.md)
2. [Payment Lifecycle 101](./payment_lifecycle_101.md)
3. [Banking Roles and Teams](./banking_roles.md)
4. [Banking Glossary](./glossary.md)

### Stage 1 - Core Payment Flows (Beginner -> Intermediate)
Learn the flow categories and routing decisions.
1. [Outbound Payments](./outbound.md)
2. [Inbound Payments](./inbound.md)
3. [On-Us Transactions](./onus.md)
4. [Off-Us Transactions](./offus.md)
5. [Clearing](./clearing.md)
6. [Settlement](./settlement.md)

### Stage 2 - ISO 20022 Message Chain (Intermediate)
Study messages in execution order:
1. [pain.001](./pain001.md) - customer payment initiation
2. [pacs.008](./pacs008.md) - interbank credit transfer
3. [pacs.002](./pacs002.md) - status report
4. [camt.054](./camt054.md) - debit/credit notification
5. [camt.053](./camt053.md) - account statement

Then exception messages:
6. [pacs.004](./pacs004.md) - payment return
7. [pain.007 and pacs.007](./pain007_pacs007.md) - reversal
8. [camt.055 and camt.056](./camt055_camt056.md) - cancellation/recall
9. [pain.004 Clarification](./pain004.md) - common naming confusion

### Stage 3 - Rails and Networks (Intermediate)
1. [NPP](./npp.md)
2. [PayTo](./payto.md) — Modern pull payments / NPP mandates
3. [BECS Direct Entry](./becs.md) — Batch credit/debit rail
4. [Direct Debit / BECS DDR](./direct_debit.md)
5. [BPAY](./bpay.md)
6. [RTGS / HVCS / RITS](./rtgs.md) — High-value settlement
7. [SWIFT](./swift.md) — Cross-border messaging
8. [Correspondent Banking](./correspondent_banking.md)

### Stage 4 - Ledger and Core Banking (Intermediate -> Advanced)
1. [Core Banking System](./core_banking.md)
2. [Account Types](./account_types.md)
3. [Debtor](./debtor.md)
4. [Debit Posting](./debit_post.md)
5. [Credit Posting](./credit_post.md)
6. [Debit Reversal](./debit_reversal.md)
7. [Payment Return](./payment_return.md)
8. [FX in Payments](./fx.md)
9. [Interest and Fees](./interest_fees.md)
10. [FIS Integration](./fis.md)
11. [Liquidity Management](./liquidity.md)

### Stage 5 - Risk, Compliance, and Operations (Advanced)
1. [Fraud Detection and Prevention](./fraud.md)
2. [Confirmation of Payee (CoP)](./cop.md)
3. [Sanctions Screening](./sanction.md)
4. [AML, CTF, and KYC](./aml_kyc.md)
5. [Regulatory Reporting](./regulatory_reporting.md) — TTR, IFTI, SMR, APRA
6. [Payment Exceptions and Investigations](./payment_exceptions.md)
7. [Reconciliation](./reconciliation.md)
8. [Error Codes Reference](./error_codes.md)
9. [Testing in Banking and Payments](./testing_banking.md)

### Stage 6 - Architecture and Engineering Patterns (Advanced)
1. [Idempotency in Payments](./idempotency.md)
2. [Payment Hub Architecture](./payment_hub.md)

### Stage 7 - Modernization and Strategy
1. [ISO 20022 Migration](./iso20022_migration.md)
2. [Open Banking and CDR](./open_banking.md)

---

## Role Tracks

### Developer Track
Follow: Stage 0 -> Stage 1 -> Stage 2 -> Stage 4 -> Stage 5
Focus topics:
- Message schemas and field mapping
- Idempotent posting and retries
- Exception-safe state transitions

### Operations / Analyst Track
Follow: Stage 0 -> Stage 1 -> Stage 3 -> Stage 5
Focus topics:
- Status monitoring and exception handling
- Reconciliation and return workflows
- SLA and incident triage

### Compliance / Risk Track
Follow: Stage 0 -> Stage 1 -> Stage 5
Focus topics:
- Sanctions, AML/KYC, fraud controls
- Hold/release/return decision points
- Regulatory reporting and evidence

### Product / Business Track
Follow: Stage 0 -> Stage 1 -> Stage 3 -> Stage 6
Focus topics:
- Rail capability and customer experience trade-offs
- Pricing/latency/risk considerations
- Modernization opportunities

---

## Quick Revision Path (60-90 minutes)
If you need a fast refresh before interviews or design discussions:
1. [Payment Lifecycle 101](./payment_lifecycle_101.md)
2. [On-Us Transactions](./onus.md) and [Off-Us Transactions](./offus.md)
3. [pain.001](./pain001.md) -> [pacs.008](./pacs008.md) -> [pacs.002](./pacs002.md)
4. [pacs.004](./pacs004.md), [Debit Reversal](./debit_reversal.md), [Payment Return](./payment_return.md)
5. [Reconciliation](./reconciliation.md), [Fraud](./fraud.md), [Sanctions](./sanction.md)

---

## End-to-End Payment Lifecycle

The diagram below shows a complete outbound off-us NPP credit transfer — the most common domestic payment type in Australia.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ORIGINATION           DEBTOR BANK                  CREDITOR BANK           │
│                                                                              │
│  Customer              Receive pain.001             Receive pacs.008        │
│  submits    ──────►    Validate & Auth   ──────►    Validate Schema         │
│  pain.001              Balance Check                Duplicate Check         │
│                        Sanctions Screen             Sanctions Screen        │
│                        Fraud Assessment             Fraud Assessment        │
│                        Debit Posting                Account Lookup          │
│                        Build pacs.008               Credit Posting          │
│                        Submit to NPP    ◄──────     Send camt.054 ──► Cdtr  │
│                        Receive pacs.002             (CRDT notification)     │
│                        Send camt.054    ──────►                             │
│                        (DBIT notification) Dbtr                             │
│                        Send pain.002    ──────►                             │
│                        (status report)  Customer                            │
│                                                                              │
│  SETTLEMENT:  RBA Fast Settlement Service (FSS) — real-time gross           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ISO 20022 Message Chain

```
Customer ──[pain.001]──► Debtor Bank ──[pacs.008]──► Network ──[pacs.008]──► Creditor Bank
         ◄─[pain.002]───              ◄─[pacs.002]───                                │
                                                                              [camt.054]
                                      [camt.054]──► Debtor Customer           │
                                                                         Creditor Customer
              If undeliverable:
Debtor Bank ◄─[pacs.004]────────────────────────────────────── Creditor Bank
            ──[camt.054 return]──► Debtor Customer
```

---

## Key ID Fields — Traceability Across Messages

Every payment carries a chain of IDs that allow full end-to-end tracing:

| ID | Who Sets It | Lives In | Purpose |
|----|------------|---------|---------|
| `EndToEndId` | Originating customer | pain.001 → pacs.008 → camt.054 | Customer's own reference; never changed |
| `InstrId` | Debtor bank | pacs.008, pacs.002 | Bank's instruction reference |
| `TxId` | Debtor bank | pacs.008, pacs.002 | Unique transaction ID for dedup |
| `MsgId` | Each sender | All messages | Message-level dedup |
| `UETR` | Debtor bank | SWIFT messages | Universal tracker for gpi |
| `AcctSvcrRef` | Creditor bank | camt.053, camt.054 | Bank's ledger reference |
| `MndtId` | Creditor/payer | Direct debit messages | PayTo/BECS mandate reference |

---

## Payment Scheme Quick-Select

```
Is the payment a direct debit (pull)?
  └─► PayTo (NPP) for new — BECS DDR for legacy

Is the payment international?
  └─► SWIFT (MT103 / pacs.008)

Is the payment domestic?
  ├─ Same bank (both accounts at our institution)?
  │   └─► On-Us — internal book transfer, no external network
  │
  ├─ High-value or time-critical (> ~$250K)?
  │   └─► RTGS / HVCS
  │
  ├─ Bill payment with BPAY biller code?
  │   └─► BPAY
  │
  ├─ Creditor bank supports NPP?
  │   └─► NPP / Osko — real-time, 24/7
  │
  └─ Fallback
      └─► BECS Direct Entry — next business day
```

---

## Risk & Compliance Checkpoints

Every payment — inbound or outbound — passes through these controls:

```
Payment Instruction
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ 1. DUPLICATE CHECK         (TxId / EndToEndId)       │
│ 2. SCHEMA VALIDATION       (XSD / business rules)    │
│ 3. AUTHENTICATION          (customer / system auth)  │
│ 4. SANCTIONS SCREENING     (OFAC, UN, DFAT, AUSTRAC) │
│ 5. FRAUD ASSESSMENT        (rules + ML model)        │
│ 6. AML / TM CHECK          (transaction monitoring)  │
│ 7. BALANCE / LIMIT CHECK   (outbound only)           │
└──────────────────────────────────────────────────────┘
       │
       ▼
  Process Payment
```

---

## Australian Regulatory Landscape

| Body | Role | Key Obligations |
|------|------|----------------|
| **RBA** | Central bank, settlement operator | ESA management, RTGS, NPP FSS |
| **APRA** | Prudential regulator | ADI licence, capital (Basel III), LCR/NSFR |
| **AUSTRAC** | AML/CTF regulator | TTR, IFTI, SMR reporting |
| **ASIC** | Market conduct regulator | Financial services licensing |
| **OAIC** | Privacy regulator | CDR / Open Banking data rules |
| **AusPayNet** | Payment scheme operator | BECS, cheque rules |
| **NPPA** | NPP operator | NPP/Osko/PayTo scheme rules |

---

## Glossary of Common Terms

| Term | Definition |
|------|-----------|
| **ADI** | Authorised Deposit-taking Institution — licensed bank/credit union |
| **ESA** | Exchange Settlement Account — account at RBA used for final settlement |
| **BIC / SWIFT code** | Bank Identifier Code — uniquely identifies a financial institution |
| **BSB** | Bank State Branch — 6-digit code identifying an AU bank branch |
| **IBAN** | International Bank Account Number — standardised account number |
| **PayID** | Proxy address (phone/email/ABN) mapped to a BSB/account via NPP |
| **UETR** | Unique End-to-end Transaction Reference — UUID used in SWIFT gpi |
| **DNS** | Deferred Net Settlement — obligations netted and settled at end of day |
| **RTGS** | Real-Time Gross Settlement — each payment settled individually, in real time |
| **LCR** | Liquidity Coverage Ratio — APRA regulatory liquidity metric |
| **PEP** | Politically Exposed Person — requires enhanced due diligence |
| **SAR / SMR** | Suspicious Activity/Matter Report — filed with AUSTRAC |
| **TTR** | Threshold Transaction Report — cash transactions ≥ AUD 10,000 |
| **IFTI** | International Funds Transfer Instruction — all cross-border transfers |
| **ChrgBr** | Charge Bearer — who pays bank fees (DEBT/CRED/SHAR/SLEV) |
| **Nostro** | "Our" account held at another bank |
| **Vostro** | "Your" (another bank's) account held at our bank |
| **Straight-Through Processing (STP)** | Payment processed end-to-end without manual intervention |
| **CoP** | Confirmation of Payee — verifying payee name matches account before payment |

---

## Java / Spring Stack Reference

Typical technology choices for a payment processing system:

| Layer | Technologies |
|-------|-------------|
| **API** | Spring Boot, Spring Web MVC / WebFlux |
| **Messaging** | Spring Integration, Apache Kafka, IBM MQ, RabbitMQ |
| **ISO 20022 Parsing** | JAXB, prowide-core, open-banking-java-sdk |
| **Database** | PostgreSQL / Oracle (transactional), Redis (caching) |
| **Security** | Spring Security, HSM for key management |
| **Scheduler** | Spring Batch (batch payments), Quartz |
| **Observability** | Micrometer, Prometheus, Grafana, ELK Stack |
| **Testing** | JUnit 5, Mockito, Testcontainers, WireMock |

---

## Contributing & Structure

Each page in this knowledge base follows a consistent structure:
1. **Overview** — What it is and why it matters
2. **Key concepts** — Definitions, types, tables
3. **Flow diagrams** — ASCII art showing the process
4. **Field/code references** — Lookup tables
5. **Java/Spring notes** — Practical implementation snippets
6. **Related concepts** — Cross-links to related pages

## Interview Questions

1. How do you explain banking payment architecture end-to-end to new backend engineers?
2. What boundaries should be explicit between payment orchestration and core banking systems?
3. Which controls are non-negotiable before allowing straight-through processing?
4. How would you measure payment platform maturity beyond transaction throughput?

Short answer guide:
- Teach by lifecycle: initiation, screening, clearing, settlement, notification.
- Keep orchestration stateless and ledger authority centralized.
- Enforce sanctions/fraud/AML gates with strong observability.
- Track failure recovery, exception handling quality, and reconciliation accuracy.

:::info[Interview Focus]
Explain payment systems as lifecycle stages with explicit control, audit, and recovery boundaries.
:::

:::danger[Interview Trap]
Discussing rails without distinguishing clearing from settlement and ledger finality.
:::
