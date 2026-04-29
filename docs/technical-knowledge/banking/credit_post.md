---
id: credit_post
title: Credit Posting
sidebar_label: Credit Posting
description: Detailed explanation of core banking credit posting, funds availability, and double-entry accounting.
tags: [banking, ledger, credit, posting, funds-availability]
---

# Credit Posting

In core banking, a **Credit Post** records an increase to a customer's account balance, signifying the deposit or receipt of funds. In standard double-entry banking ledgers, customer deposits are considered a liability for the bank (the bank *owes* the customer that money), so a credit entry *increases* the liability.

---

## Overview

Credit posting appears simple, but production behavior depends on settlement confidence and product policy. Key decision: whether funds are immediately available or restricted until settlement finality.

---

## 🏗️ The Execution Flow

Unlike a debit post, which requires strict validation of available funds before allowing the transaction, a credit post is generally additive. However, deciding **when** the customer can actually spend those funds is a massive operational and risk decision.

### 1. Memo Credit (Pending Funds)
When an inbound payment instruction (like a SWIFT MT103 or a batch BECS file) arrives, the bank often credits the customer's account immediately on the frontend:
- The customer sees an increased "Current Balance."
- The "Available Balance" may **not** increase immediately, depending on the settlement risk profile.
- The funds are marked as Pending, Uncleared, or Subject to Clearance.

This gives the customer immediate visibility that a transfer has arrived, but protects the bank from fraud if the settlement fails.

### 2. Hard Credit (Cleared Funds)
Once the actual funds have settled at the central bank (e.g., via the RBA's Exchange Settlement Account for Australian banks):
- The memo status is removed.
- The "Available Balance" is updated to match.
- The customer can now freely withdraw or spend the funds.

> [!CAUTION]
> If a bank provides "immediate funds availability" before actual settlement (common in modern real-time systems like NPP), they are taking on **Settlement Risk**. If the sending bank collapses before the end-of-day settlement, the receiving bank cannot revoke the funds already spent by the customer.

---

## Controls Checklist

- Beneficiary account and product eligibility checks
- Duplicate transaction detection before posting
- Value-date and booking-date consistency controls
- Compliance holds (sanctions/legal/fraud) before making funds available
- Idempotent processing for retried inbound notifications

---

## ⚖️ Double-Entry Accounting

A core banking engine must always balance. A credit to a customer's account is only half of the transaction. The other half must be a debit to an internal suspense, clearing, or correspondent bank account.

**Example: Receiving an inbound $500 SWIFT wire from Citibank.**

1. **Credit:** Customer Retail Account (`Cr $500`) - Liability increases.
2. **Debit:** Nostro Account / Vostro Account (`Dr $500`) - Asset increases (or liability decreases).

If these two ledgers don't match down to the exact cent at the end of the day, an automated alert triggers an Investigation / Exceptions workflow.

---

## Common Exceptions

- Credit posted, then upstream return received (`pacs.004`)
- Beneficiary account closed between validation and posting
- Notification delivered but posting failed (requires replay)
- Reconciliation mismatch between scheme totals and ledger entries

These exceptions should feed standardized investigation queues with SLA ownership.

---

## 🔗 Related Concepts
- [Debit Posting](./debit_post.md)
- [Payment Return](./payment_return.md)
- [Settlement](./settlement.md)
