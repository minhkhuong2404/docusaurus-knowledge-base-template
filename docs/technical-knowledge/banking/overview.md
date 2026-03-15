---
id: overview
title: Banking Domain Knowledge Base
sidebar_label: Overview
sidebar_position: 0
slug: /
description: Overview of Banking Domain Knowledge Base.
tags: [banking, overview, domain]
---

# 🏦 Banking Domain Knowledge Base

A comprehensive, engineer-focused reference for payment systems, ISO 20022 messaging, core banking concepts, and Australian payment infrastructure. Built for Java/Spring developers working in the payments domain.

---

## What's in This Knowledge Base?

| Section | Topics Covered |
|---------|---------------|
| **ISO 20022 Messages** | pain.001, pain.002, pacs.008, pacs.002, camt.053, camt.054 |
| **Payment Flows** | Inbound, Outbound, On-Us, Off-Us |
| **Payment Rails** | NPP, SWIFT, BECS/Direct Debit, BPAY, RTGS, PayTo |
| **Parties & Institutions** | Debtor, Creditor, FIs, Correspondent Banks |
| **Accounting & Posting** | Debit/Credit Post, Debit Reversal, Payment Return |
| **Clearing & Settlement** | DNS, RTGS, ESA, Liquidity |
| **Risk & Compliance** | Fraud, Sanctions, AML/CTF, KYC |
| **Operations** | Reconciliation, Exceptions & Investigations, FX |
| **Modern Banking** | Open Banking/CDR, ISO 20022 Migration, Account Types |

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
