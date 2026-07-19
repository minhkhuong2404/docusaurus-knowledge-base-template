---
id: core_banking
title: Core Banking System (CBS)
sidebar_label: Core Banking System
sidebar_position: 1
description: The **Core Banking System (CBS)** is the central software platform that
  manages a bank's **primary banking operations** — account management, transaction.
tags:
- technical-knowledge
- banking
- core_banking
---
# Core Banking System (CBS)

## Overview

The **Core Banking System (CBS)** is the central software platform that manages a bank's **primary banking operations** — account management, transaction processing, product configuration, and customer records. Every payment, deposit, withdrawal, and account event ultimately flows through or is recorded in the core banking system.

Think of it as the **single source of truth** for:
- What accounts exist
- What balances they hold
- What transactions have been posted
- What products are configured

---

## What CBS Does

```
                    ┌────────────────────────────────────────┐
                    │         CORE BANKING SYSTEM            │
                    │                                        │
  Channels          │  ┌──────────┐    ┌──────────────────┐  │
  ├── Mobile App    │  │ Account  │    │  Ledger /        │  │
  ├── Internet      │  │ Mgmt     │    │  Accounting      │  │
  ├── Branch        │  │ Module   │    │  Engine          │  │
  ├── ATM           │  └──────────┘    └──────────────────┘  │
  └── API           │  ┌──────────┐    ┌──────────────────┐  │
         │          │  │ Product  │    │  Customer /      │  │
         └─────────►│  │ Config   │    │  CIF Module      │  │
                    │  └──────────┘    └──────────────────┘  │
  Payments          │  ┌──────────┐    ┌──────────────────┐  │
  ├── NPP           │  │ Interest │    │  Reporting &     │  │
  ├── BECS          │  │ & Fees   │    │  Statements      │  │
  ├── SWIFT    ────►│  └──────────┘    └──────────────────┘  │
  └── RTGS          │                                        │
                    └────────────────────────────────────────┘
```

---

## Core Modules

### 1. Account Management
- Create, modify, and close accounts
- Manage account status (Active / Dormant / Closed / Blocked)
- Maintain account linkages (offset accounts, joint accounts)
- Account-level flags (direct debit allowed, international payments, etc.)

### 2. Customer Information File (CIF)
- Central customer record (KYC details)
- Links all accounts to a customer
- Risk classification, PEP flags, relationship history
- One customer → many accounts

```
CIF (Customer Master)
├── CustomerID: CUST-001
├── Name: Jane Smith
├── DOB: 1985-06-15
├── KYC Status: VERIFIED
├── PEP Flag: false
├── Risk Rating: LOW
└── Accounts:
    ├── Account 001 — Transaction (AUD)
    ├── Account 002 — Savings (AUD)
    └── Account 003 — Term Deposit (AUD)
```

### 3. General Ledger / Accounting Engine
- Double-entry bookkeeping
- Posts debits and credits for every event
- Maintains real-time account balances
- Generates trial balances and financial reports

### 4. Product Factory / Configuration
- Defines product parameters (interest rates, fees, limits)
- Attaches rules to account types
- Supports product versioning and promotional rates

### 5. Interest & Fees Engine
- Calculates interest daily (accrual basis)
- Credits/debits interest on schedule
- Applies transaction fees, maintenance fees, dishonour fees

### 6. Statement & Reporting
- Generates end-of-day camt.053 statements
- Regulatory reports (APRA, AUSTRAC)
- Customer statements

---

## Common CBS Vendors (Market)

| Vendor | Product | Notes |
|--------|---------|-------|
| **Temenos** | Transact (T24) | Very widely used globally |
| **Infosys** | Finacle | Major in Asia-Pacific |
| **Oracle** | FLEXCUBE | Large enterprise banks |
| **FIS** | Profile, BancWare | US/AU market |
| **Thought Machine** | Vault | Cloud-native; newer generation |
| **Mambu** | Mambu | Cloud-native; SaaS |
| **TCS** | BaNCS | Large APAC banks |
| **In-house** | Custom | Some major banks built their own |

---

## CBS and the Payment System

The CBS is **not** the payment engine itself — it is the system of record that **payment engines connect to**:

```
Payment Gateway / Processor
  ├── Receives pacs.008
  ├── Validates payment
  ├── Screens for sanctions/fraud
  ├── Calls CBS API: "Debit account X by $Y"  ◄── CBS interaction
  │                  "Credit account Z by $Y" ◄── CBS interaction
  └── Submits to NPP/RTGS/BECS

CBS:
  ├── Checks account status
  ├── Checks available balance
  ├── Posts the debit/credit entry
  ├── Updates balance
  └── Returns transaction reference
```

---

## Account Balance — How CBS Tracks It

Every transaction creates a **ledger entry** in CBS. Balance is derived from all entries:

```java
// Simplified — real CBS uses optimised running balance
BigDecimal balance = ledgerEntries.stream()
    .map(e -> e.isCrdt() 
        ? e.getAmount() 
        : e.getAmount().negate())
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```

### Balance Types in CBS

| Balance | Formula | Purpose |
|---------|---------|---------|
| **Ledger Balance** | Sum of all booked entries | Bank's books |
| **Available Balance** | Ledger − Holds | What customer can spend |
| **Cleared Balance** | Booked entries past clearing window | No reversal risk |
| **Shadow/Memo Balance** | Pre-booked/authorised amount | Real-time view |

---

## CBS APIs for Payment Systems

Modern CBS platforms expose APIs that payment processors call:

```java
// Typical CBS API contract for payments
interface CoreBankingService {

    // Check available balance before payment
    BalanceResponse getAvailableBalance(String accountId);

    // Reserve funds (debit hold)
    HoldResponse createHold(String accountId, BigDecimal amount, String reference);

    // Convert hold to final debit
    PostingResponse finaliseDebit(String holdId, String txReference);

    // Release a hold (payment cancelled)
    void releaseHold(String holdId);

    // Direct credit (no prior hold needed for inbound)
    PostingResponse postCredit(String accountId, BigDecimal amount, 
                                String txReference, String narrative);

    // Account validation
    AccountValidationResponse validateAccount(String bsb, String accountNumber);

    // Account details lookup
    AccountDetails getAccountDetails(String accountId);
}
```

---

## CBS in a Microservices Architecture

Modern payment platforms integrate CBS as a **downstream service**:

```
API Gateway
     │
     ▼
Payment Orchestrator (Spring Boot)
     │
     ├──► Sanctions Service
     ├──► Fraud Service
     ├──► CBS Adapter (Spring Boot)  ──► Core Banking System (T24/Finacle)
     ├──► Network Gateway (NPP/SWIFT)
     └──► Notification Service
```

The **CBS Adapter** abstracts CBS-specific APIs, so the payment orchestrator is not coupled to the vendor's proprietary interface.

---

## CBS Availability and Resilience

CBS is the most critical system in a bank. Availability requirements:

| Requirement | Target |
|-------------|--------|
| **Availability** | 99.99% (< 1 hour downtime/year) |
| **Planned maintenance** | Off-peak (Sunday 2–4 AM) |
| **Disaster recovery** | Hot standby (< 5 min RTO for payments) |
| **Read replicas** | Yes — balance enquiries hit replica; postings hit primary |
| **Transaction rate** | Major banks: thousands of TPS |

---

## Related Concepts
- [account_types.md](./account_types.md) — Account types managed by CBS
- [debit_post.md](./debit_post.md) — How payment systems call CBS for postings
- [inbound.md](./inbound.md) — CBS credit after settlement
- [outbound.md](./outbound.md) — CBS debit before submission
- [reconciliation.md](./reconciliation.md) — Reconciling CBS entries against scheme

## Interview Questions

1. How do you isolate core banking availability risk from channel and payment-service failures?
2. What migration strategy minimizes risk when modernizing legacy CBS integrations?
3. How do you enforce ledger integrity under high-concurrency posting workloads?
4. What recovery controls are mandatory for CBS incident scenarios?

Short answer guide:
- Use resilient adapters, queues, and controlled degradation around CBS dependencies.
- Migrate via strangler patterns with parallel validation and reconciliation.
- Enforce idempotent posting keys and strict accounting invariants.
- Define RTO/RPO drills, replay safety, and reconciliation checkpoints.

:::info[Interview Focus]
Position CBS as ledger authority with strict posting correctness and reconciliation guarantees.
:::

:::danger[Interview Trap]
Treating CBS as a generic downstream service without accounting invariants.
:::
