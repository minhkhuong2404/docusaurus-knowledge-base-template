---
id: account_types
title: Bank Account Types
sidebar_label: Account Types
sidebar_position: 3
description: Overview of Bank Account Types.
tags: [banking, account, types, bank]
---

# Bank Account Types

## Overview

Banks offer a range of **account types** tailored to different customer needs — from everyday transactional accounts to savings, lending, and investment products. Understanding account types is essential for payment routing, posting rules, and product configuration.

---

## Core Account Types

### 1. Transaction / Current Account (Cheque Account)

The **primary account for everyday banking** — deposits, withdrawals, and payments.

```
Characteristics:
├── No restrictions on number of transactions
├── Debit card and internet banking access
├── Direct debit and credit authority
├── BSB + Account Number (AU) / IBAN (international)
├── Typically low or no interest
├── May have monthly fee (waived on minimum balance)
└── Used as: Debtor or Creditor account in payments
```

**Payment types supported:** All — NPP, BECS, RTGS, SWIFT, BPAY, Direct Debit

### 2. Savings Account

An account designed to **accumulate funds** with interest.

```
Characteristics:
├── Higher interest rate than transaction accounts
├── May have withdrawal limits (e.g., 6 per month)
├── Some restrict outbound payments (no direct debit allowed)
├── Linked to transaction account for transfers
├── Balance-dependent bonus interest tiers
└── Term conditions may apply (e.g., no withdrawals for bonus)
```

**Important for payments:** Some savings accounts **cannot be the debtor account** for outgoing payments or direct debits.

### 3. Term Deposit (Fixed Deposit)

Funds **locked in for a fixed term** at a fixed interest rate.

```
Characteristics:
├── Fixed term: 1 month to 5 years
├── Fixed interest rate agreed at opening
├── Cannot withdraw before maturity without penalty
├── Interest paid at maturity or periodically
├── Automatically rolls over (or matures) at end of term
└── Secure, APRA-guaranteed up to $250,000 (FCS)
```

**Payment relevance:** Cannot be used as source of funds for payments during the term.

### 4. Offset Account

A transaction account **linked to a home loan** where the balance offsets the loan principal for interest calculations.

```
Home Loan: $500,000
Offset Balance: $50,000
Interest calculated on: $450,000 (net)
```

Payments work normally — it's a transaction account with a loan linkage.

### 5. Overdraft / Line of Credit

An account that allows the balance to **go below zero** up to an approved limit.

```
Overdraft Limit: $10,000
Current Balance: -$3,000 (in use)
Available Funds: $7,000

Payment validation: Check available balance = Balance + Overdraft limit
```

---

## Business Account Types

| Account | Purpose |
|---------|---------|
| **Business Transaction** | Everyday business payments, payroll |
| **Business Savings** | Short-term cash reserves |
| **Corporate Trust** | Holds client funds (solicitors, real estate agents) |
| **Operating Account** | Main business account for expenses/receipts |
| **Payroll Account** | Dedicated account for salary payments |
| **Foreign Currency** | Holds balances in currencies other than AUD |

---

## Account Identifiers

### Australian Accounts

| Identifier | Format | Example | Used In |
|-----------|--------|---------|---------|
| **BSB** | 6 digits (XXX-XXX) | 062-000 | BECS, NPP |
| **Account Number** | 6–10 digits (bank-specific) | 12345678 | BECS, NPP |
| **PayID** | Phone / Email / ABN / OrgID | 0412345678 | NPP only |
| **BSB + Account** | Combined | 062-000 / 12345678 | All domestic |

### International Accounts

| Identifier | Format | Example | Used In |
|-----------|--------|---------|---------|
| **IBAN** | Up to 34 alphanumeric | GB82WEST12345698765432 | SEPA, SWIFT |
| **BBAN** | Country-specific | 12345698765432 | Domestic subset of IBAN |
| **Account + BIC** | Account + SWIFT code | 123456 + ANZBAU3M | SWIFT |

---

## Account Status Values

| Status | Meaning | Payment Impact |
|--------|---------|---------------|
| `ACTIVE` | Normal operating account | Accept debits and credits |
| `DORMANT` | No activity for defined period (e.g., 7 years) | May require reactivation; credits may be redirected to ASIC |
| `BLOCKED` / `FROZEN` | Restricted by bank (fraud, AML, legal) | No debits or credits allowed |
| `CLOSED` | Account terminated | Reject all payments; return inbound |
| `PENDING_CLOSE` | Closure in progress | Credits may still apply; debits rejected |
| `OVERDRAWN` | Balance below zero (no overdraft) | Payments may be rejected |

---

## Account Balance Types

A single account has multiple balance views:

```
LEDGER BALANCE          All posted entries (booked)
      │
      - HOLDS / RESERVED  Funds reserved for pending authorisations
      │
      = AVAILABLE BALANCE  What the customer can actually spend
      
CLEARED BALANCE         Subset of ledger that has cleared (no reversal risk)

VALUE-DATED BALANCE     Balance as of a specific value date (for interest)
```

```java
@Entity
public class AccountBalance {
    private BigDecimal ledgerBalance;      // All booked entries
    private BigDecimal availableBalance;   // Ledger - holds
    private BigDecimal clearedBalance;     // Final, no-reversal-risk entries
    private BigDecimal uncleared;          // Pending (cheques, etc.)
    private BigDecimal holds;              // Reserved for authorisations
    private BigDecimal overdraftLimit;     // Approved overdraft
    
    public BigDecimal getEffectiveAvailable() {
        return availableBalance.add(overdraftLimit);
    }
    
    public boolean canPay(BigDecimal amount) {
        return getEffectiveAvailable().compareTo(amount) >= 0;
    }
}
```

---

## Account Flags Relevant to Payments

| Flag | Meaning | Payment Impact |
|------|---------|---------------|
| `DEBIT_BLOCKED` | Account cannot be debited | Reject outbound payments |
| `CREDIT_BLOCKED` | Account cannot be credited | Return inbound payments |
| `DIRECT_DEBIT_ALLOWED` | Customer authorised direct debits | Required for pull payments |
| `INTERNATIONAL_PAYMENTS` | Allow cross-border payments | Block SWIFT if false |
| `HIGH_RISK_FLAG` | Enhanced monitoring | Additional fraud/AML checks |
| `DORMANCY_FLAG` | Account dormant (ASIC reporting required) | Special handling |
| `JOINT_ACCOUNT` | Multiple signatories | May require dual authorisation |

---

## Financial Claims Scheme (FCS) — APRA Guarantee

```
The Australian Government guarantees deposits up to AUD $250,000
per person per ADI under the Financial Claims Scheme (FCS).

Covers: Transaction accounts, savings accounts, term deposits
Does NOT cover: Investments, managed funds, superannuation

Relevant for: Risk assessment, product documentation
```

---

## Account Types in ISO 20022

In pacs.008 / pain.001, account type is specified in `CdtrAcct`:

```xml
<CdtrAcct>
    <Id>
        <IBAN>GB82WEST12345698765432</IBAN>    <!-- International -->
        <!-- OR -->
        <Othr>
            <Id>123456789</Id>
            <SchmeNm>
                <Cd>BBAN</Cd>    <!-- Domestic -->
            </SchmeNm>
        </Othr>
    </Id>
    <Tp>
        <Cd>CACC</Cd>   <!-- Current Account -->
        <!-- SVGS = Savings, TRAD = Trade, NREX = Non-Resident External -->
    </Tp>
    <Ccy>AUD</Ccy>
</CdtrAcct>
```

### Account Type Codes
| Code | Account Type |
|------|-------------|
| `CACC` | Current Account |
| `SVGS` | Savings Account |
| `TRAD` | Trade Account |
| `NREX` | Non-Resident External Account |
| `LOAN` | Loan Account |
| `MGLD` | Marginal Lending |

---

## Related Concepts
- [debtor.md](/technical-knowledge/banking/debtor) — Account holder roles
- [inbound.md](/technical-knowledge/banking/inbound) — Account lookup on credit
- [outbound.md](/technical-knowledge/banking/outbound) — Balance check on debit
- [debit_post.md](/technical-knowledge/banking/debit_post) — How entries are posted to accounts
- [reconciliation.md](/technical-knowledge/banking/reconciliation) — Balance reconciliation
